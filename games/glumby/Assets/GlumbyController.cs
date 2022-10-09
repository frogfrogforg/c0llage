using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class GlumbyController : MonoBehaviour
{
    [Header("References")]
    public JSCallbacks jsCallbacks;
    public Animator animator;
    public GameObject glumbyRenderObject;

    [Header("Parameters")]
    [SerializeField]
    private float _jumpHeight = 1f;

    [SerializeField]
    private float _gravity = 1f;

    [SerializeField]
    private float _acceleration = 1f;

    [SerializeField]
    private float _wallJumpSpeed = 5f;

    [SerializeField]
    private float _wallJumpHeight = 1f;
    [SerializeField]
    private int nWallJumps = 1;

    [SerializeField]
    private float _turnSpeed = 1080f;

    [SerializeField]
    private float _frictionLambda = 1.0f; // exponential decay per second

    [SerializeField]
    private float _animationSpeedFactor = 10.0f; // a kludge

    [Header("State")]
    [SerializeField]
    private bool _canWallJump;

    [SerializeField]
    private int _wallJumpCounter;
    private Vector3 _direction;
    private Vector3 _velocity;
    private float _yVelocity;
    private Vector3 _wallJumpNormal;
    private CharacterController _controller;

    private bool _wasGlumbyDumplingOpen;

    [Header("Dependent variables")]

    [SerializeField]
    private float _maxVelocity;

    void Start()
    {
        _controller = GetComponent<CharacterController>();
        _wasGlumbyDumplingOpen = false;
        glumbyRenderObject.SetActive(false);
    }

    void Update()
    {
        HandleMovement();

        Rect? glumbyDumplingRect = jsCallbacks.GetGlumbyDumplingRect();
        if (glumbyDumplingRect.HasValue != _wasGlumbyDumplingOpen) {
            if (glumbyDumplingRect.HasValue) {
                // dumpling just opened, position glumby and show
                transform.position = jsCallbacks.ScreenPointToWorldPoint(glumbyDumplingRect.Value.center);
                Debug.Log(transform.position);
                glumbyRenderObject.SetActive(true);
            } else {
                // just closed, hide glumby
                glumbyRenderObject.SetActive(false);
            }
            _wasGlumbyDumplingOpen = glumbyDumplingRect.HasValue;
        }

        if (glumbyDumplingRect.HasValue) {
            // Clamp glumby's coordinates inside his dumpling.
            Bounds b = jsCallbacks.ScreenRectToWorldBounds(glumbyDumplingRect.Value);
            transform.position = new Vector3 (
                Mathf.Clamp(transform.position.x, b.min.x+_controller.bounds.extents.x, b.max.x-_controller.bounds.extents.x),
                Mathf.Clamp(transform.position.y, b.min.y+_controller.bounds.extents.y, b.max.y-_controller.bounds.extents.y),
                transform.position.z
            );
        }
    }

    private void OnControllerColliderHit(ControllerColliderHit hit)
    {
        if (!_controller.isGrounded && !hit.transform.CompareTag("Wall")) return;
        // Touching wall

        if (_wallJumpCounter >= nWallJumps) return;

        Debug.DrawRay(hit.point,hit.normal, Color.blue);
        
        _canWallJump = true;
        _wallJumpNormal = hit.normal;
    }

    private void HandleMovement()
    {
        var horizontalInput = Input.GetAxisRaw("Horizontal");

        Vector3 forward;
        if (Mathf.Abs(horizontalInput) > 0.1f) {
            forward = Vector3.left*horizontalInput;
        } else {
            forward = Vector3.forward;
        }
        // Set rotation according to input
        transform.forward = Vector3.RotateTowards(transform.forward, forward, maxRadiansDelta: Time.deltaTime*_turnSpeed*Mathf.Deg2Rad, maxMagnitudeDelta: 1f);

        // Allow movement in air
        _direction = new Vector3(horizontalInput, 0, 0);
        _velocity += _direction * _acceleration * Time.deltaTime;

        // Friction
        _velocity = _velocity * Mathf.Exp(-_frictionLambda*Time.deltaTime);
        _maxVelocity = -_acceleration/(1f-1f/Mathf.Exp(-_frictionLambda*Time.deltaTime)); // This seems to be completely wrong

        if (_controller.isGrounded)
        {
            // On the ground
            _canWallJump = false;
            _wallJumpCounter = 0;
            
            if (Input.GetButtonDown("Jump"))
            {
                _yVelocity = _jumpHeight;
            }
        } else {
            if (Input.GetButtonDown("Jump"))
            {
                if (_canWallJump)
                {
                    _wallJumpCounter++;
                    _yVelocity = _wallJumpHeight;
                    _velocity = _wallJumpNormal * _wallJumpSpeed;
                    _canWallJump = false;
                }
            }
            _yVelocity -= _gravity * Time.deltaTime;
        }

        _velocity.y = _yVelocity;

        _controller.Move(_velocity * Time.deltaTime);

        Vector3 lateralVelocity = _velocity;
        lateralVelocity.y = 0f;

        animator.SetFloat("Speed", lateralVelocity.magnitude/_animationSpeedFactor);
    }
}
